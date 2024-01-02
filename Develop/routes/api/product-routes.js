const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  try {
    const productData = await Product.findAll({
      include: [
        { model: Category },
        {
          model: Tag,
          attributes: ['tag_name'],
          through: ProductTag,
          as: 'productTag_products',
        }
      ]
    })
    res.status(200).json(productData)
  } catch (err) {
    res.status(500).json(err)
  }
});

// get one product
router.get('/:id', async (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [
        { model: Category },
        {
          model: Tag,
          attributes: ['tag_name'],
          through: ProductTag,
          as: 'productTag_products',
        }]
    })    
        if(!productData) {
        res.status(404).json({ message: 'No product found with that id!' });
        return;
      }
        res.status(200).json(productData)
    
  } catch {
    res.status(500).json(err)
  }
});

// create new product
router.post('/', async (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */

  try {
    // Create the product
    const product = await Product.create(req.body, {
      include: [
        { model: Category },
        {
          model: Tag,
          attributes: ['tag_name'],
          through: ProductTag,
          as: 'productTag_products',
        },
      ],
    });

    // if there are product tags, create pairings to bulk create in the ProductTag model
    if (req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: product.id,
          tag_id,
        };
      });

      // Bulk create product tags
      const productTagIds = await ProductTag.bulkCreate(productTagIdArr);

      // Reload the product with associated data
      await product.reload({
        include: [
          { model: Category },
          {
            model: Tag,
            attributes: ['tag_name'],
            through: ProductTag,
            as: 'productTag_products',
          },
        ],
      });

      // Respond with the created product and product tag ids
      res.status(200).json(product);
    } else {
      // If no product tags, just respond with the created product
      res.status(200).json(product);
    }
  } catch (err) {
    console.error(err);
    res.status(400).json(err);
  }
});

router.put('/:id', async (req, res) => {
  try {
    // update product data
    await Product.update(req.body, {
      where: {
        id: req.params.id,
      },
    });

    // Reload the updated product with associated data
    const updatedProduct = await Product.findByPk(req.params.id, {
      include: [
        { model: Category },
        {
          model: Tag,
          attributes: ['tag_name'],
          through: ProductTag,
          as: 'productTag_products',
        },
      ],
    });

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// delete a product
router.delete('/:id', async (req, res) => {
  try {
    // Find the product by its id
    const product = await Product.findByPk(req.params.id);

    // If the product doesn't exist, return a 404 status
    if (!product) {
      res.status(404).json({ message: 'No product found with that id!' });
      return;
    }

    // Delete the product
    await product.destroy();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
